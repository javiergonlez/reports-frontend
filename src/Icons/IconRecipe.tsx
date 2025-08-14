import React from "react";

const IconRecipe = (
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
      src="/recipe.png"
      alt="receta"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconRecipe };