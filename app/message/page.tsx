import EditBtn from "./EditBtn";
import { prisma } from '@/lib/prisma';
import { addMessage, deleteMessage } from './actions';
import Link from 'next/link';

const PAGE_SIZE = 2;

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function MessagePage({ searchParams }: Props) {
  // Next15：searchParams是Promise，必须await
  const params = await searchParams;
  const pageStr = params.page;
  const currentPage = Number(pageStr) || 1;

  const skip = (currentPage - 1) * PAGE_SIZE;

  // 一次性获取留言列表 + 总条数
  const [list, totalCount] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.message.count()
  ]);

  const totalPage = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>留言板【Server Actions版】</h1>

      {/* 表单：直接调用服务端addMessage，不需要fetch */}
      <form action={addMessage} method="post" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>昵称：</label>
          <input name="name" style={{ padding: '6px', width: '200px' }} placeholder="输入你的昵称" required />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>留言内容：</label>
          <textarea name="content" rows={4} style={{ padding: '6px', width: '300px' }} placeholder="写下留言" required></textarea>
        </div>
        <button type="submit" style={{ padding:'6px 12px' }}>提交留言</button>
      </form>

      {/* 留言列表 */}
      <div>
        <h3>全部留言（{totalCount}条）</h3>
        {list.length === 0 ? (
          <p>暂无留言</p>
        ) : (
          <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
            {list.map((item) => (
              <div key={item.id} style={{ border:'1px solid #ddd', padding:'12px', borderRadius:'6px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:'bold' }}>{item.name}</span>
                  <span style={{ fontSize:'12px', color:'#666' }}>{item.createdAt.toLocaleString()}</span>
                </div>
                <p>{item.content}</p>
                {/* 删除按钮，调用deleteMessage */}
                <EditBtn msg={item} />
                <form action={deleteMessage} method="post">
  <input type="hidden" name="msgId" value={item.id} />
  <button type="submit" style={{ fontSize:'12px', color:'red' }}>删除</button>
</form>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页按钮：上一页 / 下一页 */}
      <div style={{ marginTop:'20px', gap:'10px', display:'flex' }}>
        {currentPage > 1 && (
          <Link href={`/message?page=${currentPage - 1}`} style={{ padding:'4px 8px', border:'1px solid #999' }}>上一页</Link>
        )}
        <span>第 {currentPage} / {totalPage} 页</span>
        {currentPage < totalPage && (
          <Link href={`/message?page=${currentPage + 1}`} style={{ padding:'4px 8px', border:'1px solid #999' }}>下一页</Link>
        )}
      </div>
    </div>
  );
}
