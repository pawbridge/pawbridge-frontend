import { NavigationLinks } from './NavigationGroup';
import { lostAnimalDestinations } from '../../lib/navigationDestinations';

export function LostAnimalLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate: () => void }) {
  return <NavigationLinks id="lost" destinations={lostAnimalDestinations} mobile={mobile} onNavigate={onNavigate} />;
}
