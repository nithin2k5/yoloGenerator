'use client';

export default function StepProgress({ currentStep, onStepChange }) {
  const steps = [
    { id: 0, name: 'Classes', icon: '🏷️' },
    { id: 1, name: 'Upload', icon: '📁' },
    { id: 2, name: 'Annotate', icon: '🎯' },
    { id: 3, name: 'Export', icon: '💾' }
  ];

  return (
    <div className="flex justify-center mb-16">
      <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 cursor-pointer ${
                currentStep === step.id
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg scale-110'
                  : currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              onClick={() => onStepChange(step.id)}
            >
              <span className="text-2xl">{step.icon}</span>
            </div>
            
            <div className="ml-3 hidden sm:block">
              <p className={`font-semibold ${currentStep === step.id ? 'text-white' : 'text-gray-400'}`}>
                {step.name}
              </p>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-6 rounded ${
                currentStep > index ? 'bg-green-500' : 'bg-gray-600'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
