import { registerRenderer } from '../registry'
import BalanceScale from './BalanceScale'

registerRenderer({
  id: 'equation',
  name: { zh: '天平方程', en: 'Balance Scale' },
  component: BalanceScale,
  author: 'EurekaCub Core',
  version: '1.0.0',
})
