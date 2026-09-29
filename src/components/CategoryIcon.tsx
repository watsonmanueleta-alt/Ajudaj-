import React from 'react';
import { 
  Wrench, 
  Zap, 
  Car, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Wind, 
  Paintbrush, 
  Hammer,
  HelpCircle
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-6 h-6' }) => {
  switch (iconName?.toLowerCase()) {
    case 'wrench':
    case 'canalizacao':
      return <Wrench className={className} />;
    case 'zap':
    case 'eletricidade':
      return <Zap className={className} />;
    case 'car':
    case 'mecanica':
      return <Car className={className} />;
    case 'smartphone':
    case 'telemoveis':
      return <Smartphone className={className} />;
    case 'monitor':
    case 'informatica':
      return <Monitor className={className} />;
    case 'sparkles':
    case 'limpeza':
      return <Sparkles className={className} />;
    case 'wind':
    case 'climatizacao':
      return <Wind className={className} />;
    case 'paintbrush':
    case 'pintura':
      return <Paintbrush className={className} />;
    default:
      return <Hammer className={className} />;
  }
};
