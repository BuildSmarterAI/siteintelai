/// <reference types="@google/model-viewer" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          loading?: "auto" | "lazy" | "eager";
          reveal?: "auto" | "manual";
          "auto-rotate"?: boolean;
          "rotation-per-second"?: string;
          "camera-controls"?: boolean;
          "disable-zoom"?: boolean;
          "disable-pan"?: boolean;
          "disable-tap"?: boolean;
          "touch-action"?: string;
          "interaction-prompt"?: "auto" | "none" | "when-focused";
          "interaction-prompt-style"?: "wiggle" | "basic";
          "interaction-prompt-threshold"?: number;
          "shadow-intensity"?: string;
          "shadow-softness"?: string;
          exposure?: string;
          "environment-image"?: string;
          "skybox-image"?: string;
          "skybox-height"?: string;
          "max-camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "camera-orbit"?: string;
          "camera-target"?: string;
          "field-of-view"?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "ar-scale"?: "auto" | "fixed";
          "ar-placement"?: "floor" | "wall";
          ios?: boolean;
          xr?: boolean;
          style?: React.CSSProperties;
          class?: string;
          ref?: React.Ref<HTMLElement>;
        },
        HTMLElement
      >;
    }
  }
}

export {};
