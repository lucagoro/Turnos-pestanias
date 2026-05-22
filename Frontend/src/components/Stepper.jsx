import React from 'react'

const Stepper = ({ currentStep}) => {
    const steps = [1, 2, 3];
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {steps.map((step) => (
        <div
          key={step}
          className={`h-2 transition-all duration-500 rounded-full ${
            step === currentStep 
              ? 'w-8 bg-rose-text' // Paso actual: más largo y oscuro
              : step < currentStep 
                ? 'w-2 bg-rose-deep' // Paso completado
                : 'w-2 bg-rose-mid/40' // Paso pendiente
          }`}
        />
      ))}
    </div>
  )
}

export default Stepper
