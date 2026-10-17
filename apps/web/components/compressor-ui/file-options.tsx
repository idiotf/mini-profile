import { observer } from 'mobx-react-lite'
import type { FileItem } from '@/stores/file-list-store'
import { Field, FieldGroup, FieldTitle } from '../ui/field'
import { NumberInput } from '../ui/number-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export interface FileOptionsUIProps {
  item: FileItem
}

const qualityItems = [
  { value: 'very-low', label: '매우 낮음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'very-high', label: '매우 높음' },
]

export const FileOptionsUI = observer(({ item }: FileOptionsUIProps) => {
  const { options } = item

  return (
    <FieldGroup>
      <Field>
        <FieldTitle>이미지 해상도</FieldTitle>
        <div className='flex items-center gap-2'>
          <NumberInput
            value={options.width}
            min={1}
            onValueChange={(v) =>
              item.setWidth(
                v === undefined ? undefined : Math.floor(Math.max(1, v)),
              )
            }
          />
          <span>×</span>
          <NumberInput
            value={options.height}
            min={1}
            onValueChange={(v) =>
              item.setHeight(
                v === undefined ? undefined : Math.floor(Math.max(1, v)),
              )
            }
          />
        </div>
      </Field>
      <Field>
        <FieldTitle>프레임률 (FPS)</FieldTitle>
        <NumberInput
          value={options.frameRate}
          min={Number.MIN_VALUE}
          step='any'
          onValueChange={(v) =>
            item.setFrameRate(
              v === undefined ? undefined : Math.max(Number.MIN_VALUE, v),
            )
          }
        />
      </Field>
      <Field>
        <FieldTitle>화질</FieldTitle>
        <Select
          value={options.quality}
          onValueChange={(v) => item.setQuality(v ?? undefined)}
          itemToStringLabel={(v) =>
            qualityItems.find(({ value }) => value === v)!.label
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {qualityItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
})
