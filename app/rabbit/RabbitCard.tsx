"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./rabbit-card.module.css";

export default function RabbitCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0.5, y: 0.5 });
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const updateCard = () => {
      const card = cardRef.current;

      if (!card) return;

      const { x, y } = mousePosition.current;

      // lastnumber determine the tilt strength
      const rotateX = (y - 0.5) * -20;
      const rotateY = (x - 0.5) * 80;

      card.style.transform = `
        perspective(800px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
      `;

      card.style.setProperty("--holo-x", `${rotateY * 8}`);
      card.style.setProperty("--holo-y", `${rotateX * 8}`);

      animationFrame.current = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };

      if (animationFrame.current === null) {
        animationFrame.current = requestAnimationFrame(updateCard);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className={styles.rabbitCard}>
      <Image
        src="/rabbit-the-knight.png"
        alt="Rabbit the Knight"
        width={270}
        height={57}
        priority
      />
    </div>
  );
}
