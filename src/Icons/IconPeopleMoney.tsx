import React from "react";

const IconPeopleMoney = (
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
      src="/people-money.png"
      alt="personas dinero"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconPeopleMoney };