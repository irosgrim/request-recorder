import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeRecorder } from './api/request-recorder/setup.ts'
import React from 'react';

const App = React.lazy(() => initializeRecorder().then(() => import("./App")));


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
