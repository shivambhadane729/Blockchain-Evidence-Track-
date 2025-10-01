type Props = { className?: string };

export default function AshokaEmblem({ className = "h-8 w-auto" }: Props) {
  return (
    <img
      src="https://cdn.builder.io/api/v1/image/assets%2Ffca26fb00776420ea720dfb112f15b64%2F97bdafa444c4451ca20652421f1a909f?format=webp&width=800"
      alt="State Emblem of India"
      className={className + " object-contain"}
      width={32}
      height={32}
      loading="eager"
      decoding="async"
    />
  );
}
