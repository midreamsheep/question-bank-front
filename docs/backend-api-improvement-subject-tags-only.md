# Problem API 迁移说明：仅保留「学科 + 标签」（不向前兼容，subject 为自由字符串）

日期：2026-01-29  
面向：Vegetable Forum Backend  
目的：对齐前端交互（编辑/筛选仅保留学科与标签），并移除分类/题型相关字段与筛选参数。

## 1. 背景与现状

前端产品侧已决定：
- 题目编辑：只保留「学科（subject）」与「标签（tagIds，可多选）」。
- 题库筛选：只保留「学科」与「标签（可多选）」。

后端关键规则：
- `subject` 不再是枚举，而是自由字符串（trim 后 max 64 chars）。
- “新增学科”不需要 subjects API：前端直接发送新的 `subject` 值即可。

当前后端接口里仍存在：
- 创建/更新/详情字段：`categoryIds`、`typeIds`、`tagIds`
- 列表筛选参数：`categoryId`、`typeId`、`tagId`（单选）

## 2. Breaking changes（不向前兼容）

### 2.1 Problem：创建/更新请求体收敛

接口将**移除** `categoryIds`、`typeIds` 字段（前端不得再传入）：

- `POST /api/v1/problems`
- `PUT /api/v1/problems/{id}`

建议新的请求体（仅保留学科+标签）：
```json
{
  "title": "一道不等式题",
  "subject": "MATH",
  "difficulty": 3,
  "statementFormat": "MARKDOWN",
  "statement": "题干 ...",
  "solutionFormat": "LATEX",
  "solution": "\\\\text{解：...}",
  "visibility": "PUBLIC",
  "tagIds": [1, 3, 5]
}
```

说明：
- 由于不向前兼容，若前端仍携带 `categoryIds/typeIds`，服务端可直接返回 400（推荐），以便尽早暴露联调问题。

### 2.2 Problem：列表筛选支持多标签（tagIds）

对 `GET /api/v1/problems`：
- 移除：`categoryId`、`typeId`、`tagId`
- 新增：`tagIds`（多选）

参数形式建议采用“重复 key”的标准写法，便于 Spring 直接解析：
```
GET /api/v1/problems?subject=MATH&tagIds=1&tagIds=3&page=1&pageSize=20
```

语义建议：
- `tagIds` 采用 OR 语义（命中任一标签即可返回），更符合“多选筛选”的用户直觉。
- 如后续需要 AND，可新增 `tagMatch=ANY|ALL`（默认 ANY）。

### 2.3 Problem：详情/列表返回补齐 tags（必选）

为减少前端额外拉取标签列表再映射 ID 的工作量，响应将新增 `tags`（对象数组）：
- `ProblemSummaryResponse`
- `ProblemDetailResponse`

结构（同时返回 `tagIds` + `tags`）：
```json
{
  "tagIds": [1, 3],
  "tags": [
    { "id": 1, "name": "AM-GM" },
    { "id": 3, "name": "Bounds" }
  ]
}
```

## 3. Tag：保持现状即可（建议增强项）

现有：
- `GET /api/v1/tags?subject=&keyword=`

增强建议（非必须）：
- 支持返回 `usageCount`（用于前端排序/提示）：`{ id, name, subject, usageCount }`

## 4. 前端联调注意点（强烈建议）

1) ID 精度：后端如使用 snowflake long（64-bit），建议所有 `id` 在 JSON 中序列化为字符串，避免 JS 精度丢失。  
2) 作者显示名：若 `author.nickname` 可能为空，建议提供 `author.displayName` 或保证 `nickname` 非空（fallback 到 username），否则前端只能降级显示 `用户 {id}`。

## 5. 备注

- 推荐作者信息统一返回 `author.displayName`（或保证 `nickname` 非空），否则前端只能降级显示 `用户 {id}`。
