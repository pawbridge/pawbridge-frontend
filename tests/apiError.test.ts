import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError, AxiosHeaders } from 'axios';
import { getApiErrorMessage } from '../src/lib/apiError.ts';

const failure = (data: unknown) => new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
  data, status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() },
});

test('서버의 문자열 오류 안내를 그대로 반환한다', () => {
  assert.equal(getApiErrorMessage(failure({ code: 400, message: '이미 사용 중인 닉네임입니다.', data: null }), '실패'), '이미 사용 중인 닉네임입니다.');
});

test('본문이 없거나 메시지가 문자열이 아니면 화면별 기본 안내를 사용한다', () => {
  for (const body of [null, undefined, '<html>Bad Gateway</html>', {}, { message: null }, { message: 123 }, { message: {} }, { message: '' }, { message: '   ' }]) {
    assert.equal(getApiErrorMessage(failure(body), '변경에 실패했습니다.'), '변경에 실패했습니다.');
  }
});

test('네트워크 오류와 예외는 내부 오류 대신 화면별 기본 안내를 사용한다', () => {
  for (const error of [new AxiosError('Network Error'), new Error('internal detail'), null, undefined, 'failure']) {
    assert.equal(getApiErrorMessage(error, '다시 시도해주세요.'), '다시 시도해주세요.');
  }
});
