import { useState, useCallback } from 'react';

export function useWizard(steps = [], { onComplete } = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});

  const next = useCallback((validateFn) => {
    if (validateFn) {
      const stepErrors = validateFn();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return false;
      }
    }
    setErrors({});
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return true;
    }
    if (onComplete) onComplete();
    return true;
  }, [currentStep, steps.length, onComplete]);

  const prev = useCallback(() => {
    setErrors({});
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goTo = useCallback((step) => {
    setErrors({});
    setCurrentStep(Math.max(0, Math.min(steps.length - 1, step)));
  }, [steps.length]);

  return {
    currentStep,
    stepName: steps[currentStep],
    totalSteps: steps.length,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
    errors,
    setErrors,
    next,
    prev,
    goTo,
  };
}
