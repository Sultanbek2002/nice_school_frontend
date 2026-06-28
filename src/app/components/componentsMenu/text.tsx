import React from "react";

interface TextBlockProps {
  data: {
    text: string;
  };
}

const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  if (!data || !data.text) return null;

  return (
    <section className="w-full py-4 md:py-8 overflow-hidden"> 
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          
          <div 
            className="
              mt-2 md:mt-5 
              space-y-3 md:space-y-4
              
              /* ЭТИ СВОЙСТВА ОТВЕЧАЮТ ЗА ПЕРЕНОС: */
              whitespace-normal       /* Гарантирует, что текст будет переноситься, а не идти в одну строку */
              break-words             /* Разрывает слово, если оно шире контейнера */
              overflow-wrap-anywhere  /* Самый жесткий режим переноса (для очень длинных ссылок) */
              
              /* Стили текста из твоего шаблона */
              [&>p]:text-sm sm:[&>p]:text-base 
              [&>p]:font-medium 
              [&>p]:text-muted [&>p]:text-opacity-60 
              [&>p]:leading-relaxed
            "
            dangerouslySetInnerHTML={{ __html: data.text }} 
          />
          
        </div>
      </div>
    </section>
  );
};

export default TextBlock;