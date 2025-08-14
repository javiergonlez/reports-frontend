import React from "react";

const IconMoneyCoins = (
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
      src="/money-coins.png"
      alt="atsa"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconMoneyCoins };