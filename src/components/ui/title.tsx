import React from "react";

interface TitleProps {
  children: React.ReactNode;
}

const Title: React.FC<TitleProps> = ({ children }) => {
  return (
    <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
      {children}
    </h1>
  );
};

export default Title;
