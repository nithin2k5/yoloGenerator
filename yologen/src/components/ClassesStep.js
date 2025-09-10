'use client';

import { useState } from 'react';

export default function ClassesStep({ classes, newClass, setNewClass, addClass, removeClass }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Setup Your Classes</h2>

      <div className="max-w-md mx-auto">
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            placeholder="Enter class name (e.g., 'person', 'car')"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            onKeyPress={(e) => e.key === 'Enter' && addClass()}
          />
          <button
            onClick={addClass}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Add Class
          </button>
        </div>

        {classes.length > 0 && (
          <div className="text-left">
            <h3 className="text-xl font-semibold text-white mb-3">Your Classes:</h3>
            <div className="space-y-2">
              {classes.map((className, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/20 rounded-lg">
                  <span className="font-medium text-white">{className}</span>
                  <button
                    onClick={() => removeClass(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

