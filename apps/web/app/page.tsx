import { CompressorUI } from '@/components/compressor-ui'

export default function Page() {
  return (
    <main>
      <section className='text-center'>
        <h1 className='my-8 text-4xl font-semibold text-black min-[550px]:text-5xl dark:text-white'>
          Mini Profile
        </h1>
        <p>프로필 사진을 저용량으로 압축해줍니다.</p>
      </section>
      <hr className='mx-5 my-10 border-gray-200 dark:border-gray-800' />
      <section>
        <h2 className='my-6 text-center text-4xl font-medium'>압축하기</h2>
        <CompressorUI className='m-auto my-4 max-w-3xl px-4' />
      </section>
    </main>
  )
}
