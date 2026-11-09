import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/chat_/$threadId')({
  beforeLoad: ({params}) => { throw redirect({to:'/chat',search:{c:params.threadId},replace:true}); },
});