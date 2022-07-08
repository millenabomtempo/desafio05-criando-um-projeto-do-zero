/* eslint-disable react/no-danger */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const postFormatted = {
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: post.data.content?.map(content => ({
        heading: content.heading,
        body: [...content.body],
      })),
    },
  };

  const bodyContent = post.data.content.reduce((total, item) => {
    total += item.heading.split(' ').length;
    const totalBodyWords = item.body.map(body => body.text.split(' ').length);
    totalBodyWords.map(word => (total += word));
    return total;
  }, 0);

  const readingTime = Math.ceil(bodyContent / 200);

  return (
    <>
      <Header />
      <main className={styles.postContainer}>
        <div>
          <img
            src={postFormatted.data?.banner.url}
            alt={postFormatted.data.title}
          />
        </div>
        <article className={`${commonStyles.container} ${styles.postContent}`}>
          <h1>{postFormatted.data?.title}</h1>
          <header className={styles.headerContent}>
            <time>
              <FiCalendar />
              {postFormatted.first_publication_date}
            </time>
            <span>
              <FiUser />
              {postFormatted.data?.author}
            </span>
            <time>
              <FiClock />
              {readingTime} min
            </time>
          </header>
          {postFormatted.data.content.map(content => (
            <section className={styles.sectionContent} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post');

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('post', String(slug));

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
