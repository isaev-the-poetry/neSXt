import { AppType } from 'next/app';
import { trpc } from '../utils/trpc';
import { AuthProvider } from '../contexts/AuthContext';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
};

export default trpc.withTRPC(MyApp); 