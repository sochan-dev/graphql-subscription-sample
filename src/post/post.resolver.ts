import {
  Args,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Parent,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Post } from './models/post.model';
import { GqlAuthGuard } from '../auth/guards/auth.guard';
import { User } from 'src/user/models/user.model';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Post])
  async getPosts() {
    /*return this.prisma.post.findUnique({
      where: {
        id: 1,
      },
    });*/
    return this.prisma.post.findMany();
  }

  @Query(() => [Post])
  @UseGuards(GqlAuthGuard)
  async getMyPosts(@Args('authorId') authorId: number) {
    return this.prisma.post.findMany({
      where: {
        authorId: authorId,
      },
    });
  }

  @Query(() => Post)
  @UseGuards(GqlAuthGuard)
  async getMyPost(@Args('id') id: number) {
    return this.prisma.post.findUnique({
      where: {
        id: id,
      },
    });
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('photo') photo: string,
    @Args('authorId') authorId: number,
  ) {
    return this.prisma.post.create({
      data: { title, description, photo, authorId },
    });
  }

  @Mutation(() => Post)
  async createPost2(
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('photo') photo: string,
    @Args('authorId') authorId: number,
  ) {
    const newPost = this.prisma.post.create({
      data: { title, description, photo, authorId },
    });
    pubsub.publish('updatedPost', { updatedPost: newPost });
    return newPost;
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @Args('id') id: number,
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('photo') photo: string,
    @Args('authorId') authorId: number,
  ) {
    const newPost = this.prisma.post.update({
      where: { id: id },
      data: { title, description, photo, authorId },
    });
    pubsub.publish('updatedPost', { updatedPost: newPost });
    return newPost;
  }

  @Mutation(() => Post)
  async updatePost2(
    @Args('id') id: number,
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('photo') photo: string,
    @Args('authorId') authorId: number,
  ) {
    return this.prisma.post.update({
      where: { id: id },
      data: { title, description, photo, authorId },
    });
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async deletePost(@Args('id') id: number) {
    return this.prisma.post.delete({
      where: { id: id },
    });
  }

  @Mutation(() => Post)
  async deletePost2(@Args('id') id: number) {
    const deletedPost = this.prisma.post.delete({
      where: { id: id },
    });
    pubsub.publish('deletedPost', { deletedPost: deletedPost });
    return deletedPost;
  }

  @Subscription(() => Post, {
    name: 'updatedPost', //明示的にnameを指定するとここをsubsucription名としてSDLを出力できる。まあ気にしなくていい。ここの第二引数無くていい。
    /**1つpayloadはイベントペイロード（イベント発行者から送信されたもの）を含み、もう1つvariablesはサブスクリプションリクエスト中に渡された引数を取ります。このイベントをクライアントリスナーに公開するかどうかを決定するブール値を返します。 */
    /*filter: (payload, variables) => {
      console.log('payload↓');
      console.log(payload);
      console.log('variables↓');
      console.log(variables);
      console.log('pay', payload.postAdded.title);
      console.log('val', variables.title);
      return payload.commentAdded.title !== variables.title;
    },
    //公開されたペイロードを変更するには、resolve関数
    resolve: (value) => {
      console.log('resolvevalue↓');
      return value;
    },*/
  })
  async updatedPost() {
    return pubsub.asyncIterator('updatedPost');
  }

  @Subscription(() => Post)
  async deletedPost() {
    return pubsub.asyncIterator('deletedPost');
  }

  @ResolveField(() => User)
  author(@Parent() post: Post) {
    return this.prisma.user.findUnique({ where: { id: post.authorId } });
  }

  //☆課題
  @Query(() => Post)
  async findPost(@Args('id') id: number) {
    return this.prisma.post.findUnique({
      where: {
        id: id,
      },
    });
  }

  //☆課題
  @Mutation(() => Post)
  async updatePost3(@Args('id') id: number, @Args('title') title: string) {
    return this.prisma.post.update({
      where: { id: id },
      data: { title },
    });
  }

  //☆課題
  @Subscription(() => Post)
  async insertedPost() {
    return pubsub.asyncIterator('insertedPost');
  }
}
