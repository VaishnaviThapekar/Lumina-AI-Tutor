'use client';

import React, { useEffect } from 'react';

interface ConfettiProps {
    active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
    useEffect(() => {
        if (!active) return;

        const colors = ['#9333ea', '#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
        const confettiCount = 100;
        const confettiElements: HTMLDivElement[] = [];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');

            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            confetti.style.opacity = (Math.random() * 0.5 + 0.5).toString();

            const rotation = Math.random() * 720 - 360;
            const xMovement = (Math.random() - 0.5) * 400;
            const duration = Math.random() * 2000 + 2000;

            const animation = confetti.animate([
                {
                    transform: 'translateY(0) translateX(0) rotate(0deg) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translateY(${window.innerHeight + 50}px) translateX(${xMovement}px) rotate(${rotation}deg) scale(0.5)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.onfinish = () => confetti.remove();

            document.body.appendChild(confetti);
            confettiElements.push(confetti);
        }

        // Cleanup
        return () => {
            confettiElements.forEach(el => el.remove());
        };
    }, [active]);

    return null;
}