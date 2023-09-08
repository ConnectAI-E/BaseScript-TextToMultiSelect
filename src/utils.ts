import {
  IMultiSelectFieldMeta,
  ISelectFieldConfig,
  IWidgetField,
  IWidgetTable,
  SelectOptionsType,
} from '@lark-base-open/web-api';

export async function selectAddOptions(table: IWidgetTable, field: IWidgetField, options: string[]) {
  const fieldMeta = (await field.getMeta()) as IMultiSelectFieldMeta;
  const opts = fieldMeta.property.options;
  const set = new Set<string>(opts.map(o => o.name));
  options = options.filter(o => !set.has(o));
  const outputOptions = [
    ...opts,
    ...options.map(o => ({
      name: o,
    })),
  ];
  console.log('DEBUG: ', outputOptions);
  await table.setField(field.id, {
    name: fieldMeta.name,
    type: fieldMeta.type,
    property: {
      optionsType: SelectOptionsType.STATIC,
      options: outputOptions,
    },
  } as ISelectFieldConfig);
}

export function splitText(splitKeys: string[], text: string) {
  let res = [text];
  splitKeys.forEach(k => {
    let arr = res;
    res = [];
    arr.forEach(a => {
      res.push(...a.split(k));
    });
  });
  return res;
}
