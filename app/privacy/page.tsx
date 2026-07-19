import type { Metadata } from 'next';
import { LegalPage, type LegalContent } from '../../components/LegalPage';
import type { Lang } from '../../lib/strings';

export const metadata: Metadata = {
  title: 'Privacy Policy · LiveAssist AI',
  description: 'How LiveAssist AI collects, uses, and protects your data.',
};

const content: Record<Lang, LegalContent> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: July 2026',
    intro:
      'LiveAssist AI ("we", "us") builds a private desktop overlay that turns your company documents into instant, cited answers during live calls. This policy explains what we collect and how we handle it.',
    sections: [
      {
        heading: 'Information we collect',
        body: [
          'Account details you provide, such as your name and email address when you join the waitlist or create an account.',
          'The documents you upload so the assistant can search them, and the questions you ask during a session.',
          'Basic technical and usage data (device type, app version, and interaction events) that help us keep the product reliable.',
        ],
      },
      {
        heading: 'How we use your information',
        body: [
          'To provide the core service: indexing your documents and returning cited answers to your questions.',
          'To improve reliability and performance, and to communicate product updates you have asked to receive.',
          'We do not sell your personal data, and we do not use the contents of your private documents to train third-party models.',
        ],
      },
      {
        heading: 'Data storage and security',
        body: [
          'Your documents are processed to answer your questions and are protected with industry-standard safeguards in transit and at rest.',
          'You can request deletion of your account and associated data at any time by contacting us.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'Questions about this policy? Email aibek@liveassist.tech or call +7 706 656 96 10.',
        ],
      },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: июль 2026',
    intro:
      'LiveAssist AI («мы») создаёт приватный десктоп-оверлей, который превращает документы вашей компании в мгновенные ответы с источником прямо во время звонков. Этот документ объясняет, какие данные мы собираем и как с ними обращаемся.',
    sections: [
      {
        heading: 'Какие данные мы собираем',
        body: [
          'Данные аккаунта, которые вы предоставляете: имя и адрес электронной почты при записи в лист ожидания или создании аккаунта.',
          'Документы, которые вы загружаете для поиска, и вопросы, которые вы задаёте во время сессии.',
          'Базовые технические данные и данные об использовании (тип устройства, версия приложения, события взаимодействия), помогающие поддерживать стабильность продукта.',
        ],
      },
      {
        heading: 'Как мы используем данные',
        body: [
          'Для работы основного сервиса: индексации ваших документов и выдачи ответов с источниками на ваши вопросы.',
          'Для повышения надёжности и производительности, а также для отправки обновлений продукта, на которые вы подписались.',
          'Мы не продаём ваши персональные данные и не используем содержимое ваших приватных документов для обучения сторонних моделей.',
        ],
      },
      {
        heading: 'Хранение и безопасность',
        body: [
          'Ваши документы обрабатываются для формирования ответов и защищены отраслевыми стандартами безопасности при передаче и хранении.',
          'Вы можете в любой момент запросить удаление аккаунта и связанных с ним данных, связавшись с нами.',
        ],
      },
      {
        heading: 'Контакты',
        body: [
          'Вопросы по этой политике? Пишите на aibek@liveassist.tech или звоните +7 706 656 96 10.',
        ],
      },
    ],
  },
};

export default function Page() {
  return <LegalPage content={content} />;
}
