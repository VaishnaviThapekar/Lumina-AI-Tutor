from typing import Literal
from app.config import settings

settings = settings

TeachingMode = Literal["scaffolding", "balanced", "socratic"]


class AdaptiveEngine:
    """
    Adaptive teaching engine that adjusts instruction based on competency score
    
    Score < 0.5: Scaffolding (simplified, step-by-step)
    Score 0.5-0.8: Balanced (moderate difficulty)
    Score > 0.8: Socratic (challenging, question-based)
    """
    
    def __init__(self):
        self.scaffolding_threshold = settings.SCAFFOLDING_THRESHOLD
        self.socratic_threshold = settings.SOCRATIC_THRESHOLD
    
    def determine_teaching_mode(self, competency_score: float) -> TeachingMode:
        """Determine appropriate teaching mode based on competency score"""
        if competency_score < self.scaffolding_threshold:
            return "scaffolding"
        elif competency_score >= self.socratic_threshold:
            return "socratic"
        else:
            return "balanced"
    
    def get_system_prompt(self, teaching_mode: TeachingMode, context: str = "") -> str:
        """
        Generate system prompt based on teaching mode
        Context is the retrieved information from RAG
        """
        base_prompt = f"""You are Lumina, an adaptive AI tutor that personalizes instruction based on student competency.

CONTEXT FROM LEARNING MATERIAL:
{context}

"""
        
        mode_prompts = {
            "scaffolding": """TEACHING MODE: SCAFFOLDING (Student needs foundational support)

Your approach:
1. Break down complex concepts into simple, digestible steps
2. Use concrete examples and analogies from everyday life
3. Provide clear, direct explanations without jargon
4. Offer encouragement and positive reinforcement
5. Check understanding frequently
6. Guide the student step-by-step through problems
7. Repeat key concepts in different ways

Example: Instead of "This utilizes the principle of thermodynamics," say "Think of it like heating water on a stove - the heat energy goes into the water and makes it warmer."

Be patient, supportive, and build confidence.""",

            "balanced": """TEACHING MODE: BALANCED (Student has moderate understanding)

Your approach:
1. Provide clear explanations with moderate detail
2. Use a mix of direct teaching and guided discovery
3. Introduce some technical terms with explanations
4. Ask occasional comprehension questions
5. Provide examples when needed
6. Balance support with independence
7. Gradually increase complexity

Example: "This principle, called thermodynamics, explains how energy transfers between objects. Can you think of a situation where you've observed this?"

Be clear, engaging, and gradually challenging.""",

            "socratic": """TEACHING MODE: SOCRATIC (Student has strong understanding)

Your approach:
1. Use thought-provoking questions to guide discovery
2. Challenge assumptions and encourage critical thinking
3. Present complex problems for analysis
4. Encourage the student to explain concepts to you
5. Introduce edge cases and exceptions
6. Connect concepts to broader principles
7. Minimal direct instruction - focus on inquiry

Example: "Given what you know about energy transfer, what do you think happens at the molecular level during phase transitions? What evidence would support your hypothesis?"

Be challenging, intellectually engaging, and promote deep thinking."""
        }
        
        return base_prompt + mode_prompts[teaching_mode]
    
    def update_competency_score(
        self, 
        current_score: float, 
        quiz_performance: float, 
        weight: float = 0.3
    ) -> float:
        """
        Update competency score based on quiz performance
        Uses exponential moving average for smooth transitions
        
        Args:
            current_score: Current competency score (0-1)
            quiz_performance: Latest quiz score (0-1)
            weight: Weight for new performance (0-1), default 0.3
        
        Returns:
            Updated competency score (0-1)
        """
        # Exponential moving average
        new_score = (1 - weight) * current_score + weight * quiz_performance
        
        # Ensure score stays within bounds
        return max(0.0, min(1.0, new_score))
    
    def get_difficulty_level(self, competency_score: float) -> str:
        """Get quiz difficulty level based on competency score"""
        if competency_score < 0.4:
            return "easy"
        elif competency_score < 0.7:
            return "medium"
        else:
            return "hard"
    
    def format_feedback(
        self, 
        is_correct: bool, 
        teaching_mode: TeachingMode,
        explanation: str
    ) -> str:
        """Format feedback based on teaching mode"""
        if teaching_mode == "scaffolding":
            if is_correct:
                return f"Excellent work! 🎉 {explanation}"
            else:
                return f"Not quite, but that's okay - let's learn together! {explanation}"
        
        elif teaching_mode == "balanced":
            if is_correct:
                return f"Correct! {explanation}"
            else:
                return f"Not quite. {explanation}"
        
        else:  # socratic
            if is_correct:
                return f"Precisely. {explanation} How would this principle apply in different contexts?"
            else:
                return f"Consider this: {explanation} What assumptions led you to your answer?"
