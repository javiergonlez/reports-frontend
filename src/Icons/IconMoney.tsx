import React from "react";

const IconMoney = (
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
      src="/money.png"
      alt="dinero"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconMoney };