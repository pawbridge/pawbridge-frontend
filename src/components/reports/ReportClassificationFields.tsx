import { reportRegions } from '../../lib/reportRegions';
import type { ReportAnimalType } from '../../types/api.types';
import { reportFieldClass, reportAnimalLabels } from '../../lib/reportFields';
interface Props {
  province: string; district: string; animalType: ReportAnimalType | '';
  onChange: (value: { province: string; district: string; animalType: ReportAnimalType | '' }) => void;
  required?: boolean;
}
export default function ReportClassificationFields({ province, district, animalType, onChange, required = false }: Props) {
  const districts = reportRegions.find(region => region.value === province)?.cities.filter(city => city !== '전체') || [];
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    <label className="min-w-0 text-sm font-medium">시·도{required && ' *'}
      <select className={reportFieldClass} required={required} value={province}
        onChange={event => onChange({ province: event.target.value, district: '', animalType })}>
        <option value="">{required ? '선택해 주세요' : '전국'}</option>
        {reportRegions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
      </select>
    </label>
    <label className="min-w-0 text-sm font-medium">시·군·구{required && ' (선택)'}
      <select className={reportFieldClass} disabled={!province || districts.length === 0} value={district}
        onChange={event => onChange({ province, district: event.target.value, animalType })}>
        <option value="">{!province ? '시·도 먼저 선택' : districts.length ? (required ? '모름 / 선택 안 함' : '전체') : '해당 없음'}</option>
        {district && !districts.includes(district) && <option value={district}>{district}</option>}
        {districts.map(city => <option key={city} value={city}>{city}</option>)}
      </select>
    </label>
    <label className="col-span-2 min-w-0 text-sm font-medium sm:col-span-1">동물 종류{required && ' *'}
      <select className={reportFieldClass} required={required} value={animalType}
        onChange={event => onChange({ province, district, animalType: event.target.value as ReportAnimalType | '' })}>
        <option value="">{required ? '선택해 주세요' : '전체'}</option>
        {Object.entries(reportAnimalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  </div>;
}
