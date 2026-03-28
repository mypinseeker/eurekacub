import { registerRenderer } from '../registry'
import PizzaCutter from './PizzaCutter'

registerRenderer({
  id: 'fraction',
  name: { zh: '披萨切切乐', en: 'Pizza Cutter' },
  component: PizzaCutter,
  author: 'EurekaCub Core',
  version: '1.0.0',
})
