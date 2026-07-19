import type { Metadata } from 'next';
import { LegalPage, type LegalContent } from '../../components/LegalPage';
import type { Lang } from '../../lib/strings';

export const metadata: Metadata = {
  title: 'Terms of Service · LiveAssist AI',
  description: 'The terms that govern your use of LiveAssist AI.',
};

const content: Record<Lang, LegalContent> = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: July 2026',
    intro:
      'These terms govern your use of LiveAssist AI. By downloading or using the app you agree to them. Please read them carefully.',
    sections: [
      {
        heading: 'Using the service',
        body: [
          'LiveAssist AI provides a private desktop overlay that surfaces cited answers from documents you provide.',
          'You are responsible for having the right to upload and use the documents you add, and for how you use the answers the assistant returns.',
        ],
      },
      {
        heading: 'Your account',
        body: [
          'Keep your login credentials secure. You are responsible for activity that happens under your account.',
          'You must be legally able to enter into these terms and comply with any laws that apply to your use of the service.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not use the service for unlawful purposes, to infringe the rights of others, or to attempt to disrupt or reverse-engineer the product.',
          'We may suspend or terminate access that violates these terms or puts other users at risk.',
        ],
      },
      {
        heading: 'Disclaimer and liability',
        body: [
          'The assistant helps you find answers quickly, but you remain responsible for verifying important information before acting on it.',
          'The service is provided "as is" without warranties, and our liability is limited to the maximum extent permitted by law.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'Questions about these terms? Email aibek@liveassist.tech or call +7 706 656 96 10.',
        ],
      },
    ],
  },
  ru: {
    title: 'Условия использования',
    updated: 'Обновлено: июль 2026',
    intro:
      'Эти условия регулируют использование LiveAssist AI. Скачивая или используя приложение, вы соглашаетесь с ними. Пожалуйста, внимательно ознакомьтесь.',
    sections: [
      {
        heading: 'Использование сервиса',
        body: [
          'LiveAssist AI предоставляет приватный десктоп-оверлей, который выдаёт ответы с источниками из предоставленных вами документов.',
          'Вы отвечаете за наличие прав на загрузку и использование добавляемых документов, а также за то, как вы применяете полученные ответы.',
        ],
      },
      {
        heading: 'Ваш аккаунт',
        body: [
          'Храните данные для входа в безопасности. Вы несёте ответственность за действия, совершённые под вашим аккаунтом.',
          'Вы должны иметь законное право принять эти условия и соблюдать применимое к вам законодательство.',
        ],
      },
      {
        heading: 'Допустимое использование',
        body: [
          'Не используйте сервис в противоправных целях, для нарушения прав других лиц или для попыток нарушить работу либо провести обратную разработку продукта.',
          'Мы можем приостановить или прекратить доступ, который нарушает эти условия или ставит под угрозу других пользователей.',
        ],
      },
      {
        heading: 'Отказ от гарантий и ответственность',
        body: [
          'Ассистент помогает быстро находить ответы, но вы обязаны проверять важную информацию перед принятием решений.',
          'Сервис предоставляется «как есть» без гарантий, а наша ответственность ограничена в максимально допустимой законом мере.',
        ],
      },
      {
        heading: 'Контакты',
        body: [
          'Вопросы по условиям? Пишите на aibek@liveassist.tech или звоните +7 706 656 96 10.',
        ],
      },
    ],
  },
};

export default function Page() {
  return <LegalPage content={content} />;
}
