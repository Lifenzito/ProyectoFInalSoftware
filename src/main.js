import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import './style.css'
import './assets/tailwind.css'

const rootElement = document.getElementById('root')

if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		React.createElement(React.StrictMode, null, React.createElement(App))
	)
}