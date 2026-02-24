import { createRoot } from 'react-dom/client'
import 'tailwindcss/tailwind.css'
import '@/index.css'
import App from '@/components/App'
import { Provider } from 'react-redux';
import { store } from '@/redux/reducers/index'

const container = document.getElementById('root') as HTMLDivElement
const root = createRoot(container)

root.render(<Provider store={store}><App /></Provider>)
