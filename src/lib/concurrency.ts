/**
 * 목록의 각 행마다 상세 API를 부를 때 한꺼번에 수백 개의 요청이 나가지 않도록
 * 동시에 실행하는 요청 수를 제한한다. 결과는 입력 순서 그대로 돌려준다.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** 상세 API 동시 호출 수 */
export const DETAIL_FETCH_CONCURRENCY = 5
