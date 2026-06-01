# 数据存储路径说明

## 用户数据目录

书籍和封面文件保存在 Electron 的用户数据目录下，**不在项目根目录**：

```
C:\Users\<用户名>\AppData\Roaming\epub-reader\
├── db\
│   └── epub_reader.db          # SQLite 数据库
└── upload\
    ├── books\                   # EPUB 书籍文件
    │   └── book_xxxxxx_xxx.epub
    └── covers\                  # 封面图片
        └── cover_xxxxxx.jpg
```

## 数据库路径存储

数据库中存储的是**相对路径**（相对于用户数据目录）：

```sql
book_path: "upload\books\book_123456_example.epub"
cover_path: "upload\covers\cover_123456.jpg"
```

## 路径构建逻辑

开发和生产环境统一使用 `app.getPath('userData')` 作为根目录：

```javascript
const userDataPath = app.getPath('userData')
// → C:\Users\xxx\AppData\Roaming\epub-reader
const absolutePath = path.join(userDataPath, relativePath)
```

## 注意事项

- 项目根目录下**不再保留** `upload/` 文件夹，避免与用户数据目录混淆
- `example.epub` 仅用于开发测试，不会被应用读取
- 数据库文件 `db/epub_reader.db` 在项目根目录是模板，运行时使用的是用户数据目录下的副本
