import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우리 반 방명록',
  description: '학우들 간의 가벼운 소통을 위한 방명록 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body className="font-[Pretendard] antialiased bg-surface text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
