import React, { useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { CalculatorApp } from './features/calculator/components/calculator-app';

function App() {
  return (
    <Provider store={store}>
      <CalculatorApp />
    </Provider>
  );
}

export default App;
