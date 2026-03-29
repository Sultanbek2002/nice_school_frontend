'use client'

import React from 'react'

interface SubtitleProps {
  data?: string;
}

const Subtitle: React.FC<SubtitleProps> = ({ data }) => {
  // Убираем лишние кавычки, если они пришли из базы (например, ""Мугалимдер"")
  const text = data ? data.replace(/^"|"$/g, '') : '';

  if (!text) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-midnight_text">
        {text}
      </h2>
    </div>
  )
}

export default Subtitle;