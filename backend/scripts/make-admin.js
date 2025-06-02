#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

async function findUser(identifier) {
  // Попробуем найти по email
  let user = await prisma.user.findUnique({
    where: { email: identifier },
    include: {
      userRoles: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        }
      }
    }
  });

  // Если не найден по email, попробуем по ID
  if (!user) {
    try {
      user = await prisma.user.findUnique({
        where: { id: identifier },
        include: {
          userRoles: true,
          accounts: {
            select: {
              provider: true,
              createdAt: true,
            }
          }
        }
      });
    } catch (error) {
      // Игнорируем ошибки поиска по ID
    }
  }

  return user;
}

async function assignAdminRole(userId) {
  try {
    // Проверим, есть ли уже роль ADMIN
    const existingAdminRole = await prisma.userRole.findFirst({
      where: {
        userId: userId,
        role: 'ADMIN'
      }
    });

    if (existingAdminRole) {
      return { alreadyExists: true };
    }

    // Назначаем роль ADMIN
    const adminRole = await prisma.userRole.create({
      data: {
        userId: userId,
        role: 'ADMIN',
        assignedBy: 'system-script',
      }
    });

    return { success: true, role: adminRole };
  } catch (error) {
    return { error: error.message };
  }
}

async function listAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: true,
      accounts: {
        select: {
          provider: true,
        }
      },
      _count: {
        select: {
          tokens: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  if (users.length === 0) {
    log('\n📭 В системе пока нет пользователей.', colors.yellow);
    return;
  }

  log('\n👥 Последние 10 пользователей:', colors.cyan);
  log('─'.repeat(80), colors.blue);

  users.forEach((user, index) => {
    const roles = user.userRoles.map(r => r.role).join(', ') || 'нет ролей';
    const providers = user.accounts.map(a => a.provider).join(', ') || 'нет провайдеров';
    const isAdmin = user.userRoles.some(r => r.role === 'ADMIN');
    
    log(`${index + 1}. ${user.email}`, isAdmin ? colors.red : colors.reset);
    log(`   ID: ${user.id}`, colors.blue);
    log(`   Имя: ${user.name || 'не указано'}`, colors.reset);
    log(`   Роли: ${roles}`, isAdmin ? colors.red : colors.yellow);
    log(`   Провайдеры: ${providers}`, colors.magenta);
    log(`   Токенов: ${user._count.tokens}`, colors.green);
    log(`   Создан: ${user.createdAt.toLocaleString()}`, colors.reset);
    log('');
  });
}

async function main() {
  try {
    log('🛡️  Скрипт назначения администратора NeSXt', colors.bright);
    log('═'.repeat(50), colors.blue);

    const rl = createInterface();

    // Показать существующих пользователей
    await listAllUsers();

    // Спросить, какого пользователя сделать админом
    const identifier = await question(rl, '\n🔍 Введите email или ID пользователя для назначения админом: ');

    if (!identifier.trim()) {
      log('❌ Не указан email или ID пользователя', colors.red);
      rl.close();
      return;
    }

    log('\n🔎 Поиск пользователя...', colors.yellow);

    // Найти пользователя
    const user = await findUser(identifier.trim());

    if (!user) {
      log(`❌ Пользователь с email/ID "${identifier}" не найден`, colors.red);
      rl.close();
      return;
    }

    // Показать информацию о найденном пользователе
    log('\n✅ Пользователь найден:', colors.green);
    log(`📧 Email: ${user.email}`, colors.reset);
    log(`🆔 ID: ${user.id}`, colors.blue);
    log(`👤 Имя: ${user.name || 'не указано'}`, colors.reset);
    log(`📅 Создан: ${user.createdAt.toLocaleString()}`, colors.reset);

    const currentRoles = user.userRoles.map(r => r.role);
    if (currentRoles.length > 0) {
      log(`🎭 Текущие роли: ${currentRoles.join(', ')}`, currentRoles.includes('ADMIN') ? colors.red : colors.yellow);
    } else {
      log('🎭 Текущие роли: нет ролей', colors.yellow);
    }

    // Подтверждение
    const confirm = await question(rl, '\n❓ Назначить роль ADMIN этому пользователю? (y/N): ');

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log('❌ Операция отменена', colors.yellow);
      rl.close();
      return;
    }

    log('\n⚡ Назначение роли ADMIN...', colors.yellow);

    // Назначить роль
    const result = await assignAdminRole(user.id);

    if (result.alreadyExists) {
      log('ℹ️  Пользователь уже имеет роль ADMIN', colors.yellow);
    } else if (result.success) {
      log('🎉 Роль ADMIN успешно назначена!', colors.green);
      log(`📋 ID роли: ${result.role.id}`, colors.blue);
      log(`⏰ Назначена: ${result.role.assignedAt.toLocaleString()}`, colors.reset);
    } else {
      log(`❌ Ошибка назначения роли: ${result.error}`, colors.red);
    }

    // Показать обновленную информацию о пользователе
    const updatedUser = await findUser(identifier.trim());
    const updatedRoles = updatedUser.userRoles.map(r => r.role);
    
    log('\n📊 Обновленная информация:', colors.cyan);
    log(`🎭 Роли: ${updatedRoles.join(', ')}`, colors.green);

    rl.close();

  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
main().catch(console.error); 