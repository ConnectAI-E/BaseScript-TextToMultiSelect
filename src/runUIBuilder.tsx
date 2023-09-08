import {
  FieldType,
  IMultiSelectFieldMeta,
  IOpenMultiSelect,
  IOpenSegment,
  IOpenSingleSelect,
  IWidgetField,
  IWidgetTable,
  UIBuilder,
} from '@lark-base-open/web-api';
import { selectAddOptions, splitText } from './utils';

export default async function main(uiBuilder: UIBuilder) {
  uiBuilder.markdown(`> 批量将多行文本字段内容，转化为多选字段的值  
 > 功能演示&反馈请查阅 👉 [文本转多选使用指南](https://bytedance.feishu.cn/docx/FiUWdX5IRo8BCcxBStGcsnDrnmd)`);
  uiBuilder.form(
    form => ({
      formItems: [
        form.tableSelect('table', { label: '选择数据表' }),
        form.fieldSelect('field', {
          label: '输入字段（多行文本）',
          sourceTable: 'table',
          filterByTypes: [FieldType.Text as any],
        }),
        form.fieldSelect('outField', {
          label: '输出字段（多选）',
          sourceTable: 'table',
          filterByTypes: [FieldType.MultiSelect as any],
        }),
        form.select('splitKeys', {
          label: '分隔符',
          options: [
            {
              label: '换行符(Enter)',
              value: '\n',
            },
            {
              label: '空格',
              value: ' ',
            },
            {
              label: '制表符(Tab)',
              value: '\t',
            },
            {
              label: ',',
              value: ',',
            },
            {
              label: ';',
              value: ';',
            },
          ],
          mode: 'tags',
        }),
      ],
      buttons: ['转换'],
    }),
    async ({ values }) => {
      const table = values.table as IWidgetTable;
      const field = values.field as IWidgetField;
      const outField = values.outField as IWidgetField;
      const splitKeys = values.splitKeys as string[];
      uiBuilder.showLoading('获取文本数据');
      const fvs = await field.getFieldValueList();
      uiBuilder.showLoading('分割文本');
      const res: { [key: string]: any } = {};
      const options = new Set<string>();
      fvs.forEach(v => {
        if (!v.value) {
          return;
        }
        const s = v.value as IOpenSegment[];
        const a = splitText(splitKeys, s[0].text);
        res[v.record_id] = a;
        a.forEach(n => options.add(n));
      });
      uiBuilder.showLoading('创建选项');
      await selectAddOptions(table, outField, [...options]);
      uiBuilder.showLoading('获取选项');
      const fieldMeta = (await outField.getMeta()) as IMultiSelectFieldMeta;
      const optionsMap = new Map<string, string>();
      fieldMeta.property.options.forEach(o => {
        optionsMap.set(o.name, o.id);
      });
      const promises = [];
      uiBuilder.showLoading('写入结果');
      for (const key in res) {
        promises.push(
          table.setCellValue(
            outField.id,
            key,
            res[key].map((name: string) => {
              return {
                id: optionsMap.get(name) ?? '',
                text: name,
              } as IOpenSingleSelect;
            }) as IOpenMultiSelect,
          ),
        );
      }
      await Promise.all(promises);
      uiBuilder.hideLoading();
      uiBuilder.message.success('转换完成');
    },
  );
}
