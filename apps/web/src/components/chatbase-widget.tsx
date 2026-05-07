'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    embeddedChatbotConfig?: { chatbotId: string; domain: string };
  }
}

const EXCLUDED_PATHS = ['/admin'];

export function ChatbaseWidget() {
  const pathname = usePathname();
  const isExcluded = EXCLUDED_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    const chatbotId = process.env.NEXT_PUBLIC_CHATBASE_BOT_ID;
    if (!chatbotId || isExcluded) return;
    if (document.getElementById('chatbase-script')) return;

    window.embeddedChatbotConfig = { chatbotId, domain: 'www.chatbase.co' };

    const script = document.createElement('script');
    script.id = 'chatbase-script';
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.setAttribute('chatbotId', chatbotId);
    script.setAttribute('domain', 'www.chatbase.co');
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Nettoyage si le composant est démonté (ex: navigation vers /admin)
      document.getElementById('chatbase-script')?.remove();
      delete window.embeddedChatbotConfig;
    };
  }, [isExcluded]);

  return null;
}
