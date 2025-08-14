import React from "react";

const IconRecipeMoney = (
  props: React.ImgHTMLAttributes<HTMLImageElement>
) => {
  const defaultStyle: React.CSSProperties = {
    display: "block",
    borderWidth: "1px",
    height: "3rem",
    ...props.style,
  };
  return (
    <img
      src="/recipe-money.png"
      alt="receta dinero"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconRecipeMoney };