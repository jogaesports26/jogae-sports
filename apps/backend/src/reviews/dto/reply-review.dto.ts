import { IsString, MaxLength } from 'class-validator';

export class ReplyReviewDto {
  @IsString()
  @MaxLength(500)
  reply: string;
}
