import { ApolloWrapper } from "./ApolloWrapper";
import { AuthProvider } from './auth';
import "./globals.css";


export const metadata = {
  title: "ektesad-dashboard",
  description: "Generated by mahmoud.code",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <AuthProvider>
        <ApolloWrapper>
          <body>
            {children}
          </body>
        </ApolloWrapper>
      </AuthProvider>
    </html>
  );
}
