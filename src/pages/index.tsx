import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const initialPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState(initialPosts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const nextPost = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    const newPost = nextPost.results.map(post => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setNextPage(nextPost.next_page);
    setPosts([...posts, newPost[0]]);
  }

  return (
    <div>
      <Header />

      <div className={`${styles.HomeContainer} ${commonStyles.container}`}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <strong>{post.data?.title}</strong>
              <p>{post.data?.subtitle}</p>
              <div className={styles.content}>
                <time>
                  <FiCalendar />
                  {post.first_publication_date}
                </time>
                <span>
                  <FiUser />
                  {post.data?.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button type="button" onClick={handleMorePosts}>
            Carregar mais posts
          </button>
        )}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', { pageSize: 1 });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
