import { NavigationLinks } from './NavigationGroup';
import { protectedAnimalDestinations } from '../../lib/navigationDestinations';

export function ProtectedAnimalLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate: () => void }) {
  return <NavigationLinks id="protected" destinations={protectedAnimalDestinations} mobile={mobile} onNavigate={onNavigate} />;
}
