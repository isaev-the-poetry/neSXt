#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeAdmin(email) {
  try {
    // Найти пользователя по email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
      }
    });

    if (!user) {
      log(`❌ Пользователь с email "${email}" не найден`, colors.red);
      return false;
    }

    // Проверить, есть ли уже роль ADMIN
    const hasAdminRole = user.userRoles.some(role => role.role === 'ADMIN');
    
    if (hasAdminRole) {
      log(`ℹ️  Пользователь ${email} уже имеет роль ADMIN`, colors.yellow);
      return true;
    }

    // Назначить роль ADMIN
    const adminRole = await prisma.userRole.create({
      data: {
        userId: user.id,
        role: 'ADMIN',
        assignedBy: 'quick-admin-script',
      }
    });

    log(`🎉 Роль ADMIN успешно назначена пользователю ${email}`, colors.green);
    log(`📋 ID роли: ${adminRole.id}`, colors.blue);
    log(`⏰ Назначена: ${adminRole.assignedAt.toLocaleString()}`, colors.reset);

    return true;

  } catch (error) {
    log(`❌ Ошибка: ${error.message}`, colors.red);
    return false;
  }
}

async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: 'ADMIN'
          }
        }
      },
      include: {
        userRoles: {
          where: {
            role: 'ADMIN'
          }
        }
      }
    });

    if (admins.length === 0) {
      log('📭 В системе пока нет администраторов', colors.yellow);
    } else {
      log(`👨‍💻 Администраторы в системе (${admins.length}):`, colors.cyan);
      log('─'.repeat(60), colors.blue);
      
      admins.forEach((admin, index) => {
        const adminRole = admin.userRoles[0];
        log(`${index + 1}. ${admin.email}`, colors.green);
        log(`   Имя: ${admin.name || 'не указано'}`, colors.reset);
        log(`   Назначен админом: ${adminRole.assignedAt.toLocaleString()}`, colors.reset);
        log('');
      });
    }
  } catch (error) {
    log(`❌ Ошибка получения списка администраторов: ${error.message}`, colors.red);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    log('🛡️  Быстрое назначение администратора NeSXt', colors.bright);
    log('═'.repeat(50), colors.blue);

    // Если передан аргумент --list или -l, показать список админов
    if (args.includes('--list') || args.includes('-l')) {
      await listAdmins();
      return;
    }

    // Если не передан email, показать help
    if (args.length === 0) {
      log('\n📖 Использование:', colors.cyan);
      log('  node scripts/quick-admin.js <email>', colors.reset);
      log('  node scripts/quick-admin.js --list  # показать всех админов', colors.reset);
      log('\n📝 Примеры:', colors.cyan);
      log('  node scripts/quick-admin.js user@example.com', colors.reset);
      log('  node scripts/quick-admin.js --list', colors.reset);
      return;
    }

    const email = args[0];

    log(`\n🔍 Назначение роли ADMIN для: ${email}`, colors.yellow);
    
    const success = await makeAdmin(email);
    
    if (success) {
      log('\n📊 Текущие администраторы:', colors.cyan);
      await listAdmins();
    }

  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
main().catch(console.error); 