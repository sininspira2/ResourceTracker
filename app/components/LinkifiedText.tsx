import React from 'react';

interface LinkifiedTextProps {
  text: string;
}

const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  const urlRegex = /(https?:\/\/\S+)/g;

  if (!text) {
    return null;
  }

  const elements: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const startIndex = match.index;

    // Add the text part before the URL
    if (startIndex > lastIndex) {
      elements.push(text.substring(lastIndex, startIndex));
    }

    // Clean trailing punctuation from the URL
    const punctuationRegex = /[.,;!?)]*$/;
    const trailingPunctuationMatch = url.match(punctuationRegex);
    const trailingPunctuation = trailingPunctuationMatch ? trailingPunctuationMatch[0] : '';
    const cleanUrl = url.substring(0, url.length - trailingPunctuation.length);

    // Add the link element if it's not empty after cleaning
    if (cleanUrl) {
      elements.push(
        <a
          key={startIndex}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all"
        >
          {cleanUrl}
        </a>
      );
    }

    // Add back the trailing punctuation as text
    if (trailingPunctuation) {
      elements.push(trailingPunctuation);
    }

    lastIndex = startIndex + url.length;
  }

  // Add the remaining text after the last URL
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return (
    <>
      {elements.map((element, index) => (
        <React.Fragment key={index}>{element}</React.Fragment>
      ))}
    </>
  );
};

export default LinkifiedText;
