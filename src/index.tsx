import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/pages/App'
import { Provider } from 'react-redux';
import { store } from '@/store/store'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(<Provider store={store}><App /></Provider>)
