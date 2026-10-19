import React from "react";
import "../styles/Button.css";

const VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
];

const SIZES = ["sm", "md", "lg"];

function clampOpacity(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 1;

  return Math.min(1, Math.max(0, number));
}

const Button = React.forwardRef(function Button(
  {
    text,
    children,
    variant = "primary",
    size = "md",
    opacity = 1,
    textOpacity = 1,
    width,
    height,
    loading = false,
    loadingText = "Loading...",
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = "",
    style,
    type = "button",
    ...props
  },
  ref
) {
  const safeVariant = VARIANTS.includes(variant)
    ? variant
    : "primary";

  const safeSize = SIZES.includes(size) ? size : "md";

  const buttonStyle = {
    ...style,
    opacity: clampOpacity(opacity),
    "--button-text-opacity": clampOpacity(textOpacity),
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  const classes = [
    "ui-button",
    `ui-button--${safeVariant}`,
    `ui-button--${safeSize}`,
    fullWidth ? "ui-button--full-width" : "",
    loading ? "ui-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classes}
      style={buttonStyle}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          className="ui-button__spinner"
          aria-hidden="true"
        />
      ) : (
        leftIcon && (
          <span
            className="ui-button__icon"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )
      )}

      <span className="ui-button__label">
        {loading ? loadingText : children ?? text}
      </span>

      {!loading && rightIcon && (
        <span
          className="ui-button__icon"
          aria-hidden="true"
        >
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;