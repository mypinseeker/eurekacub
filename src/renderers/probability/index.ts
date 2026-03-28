import { registerRenderer } from '../registry'
import CoinFlip from './CoinFlip'

registerRenderer({
  id: 'probability',
  name: { zh: '概率探险家', en: 'Probability Explorer' },
  component: CoinFlip,
  author: 'EurekaCub Core',
  version: '1.0.0',
})
