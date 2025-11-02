import {getCredential} from "@/lib/authHelper";
import LocalStorageHelper from "@/lib/storageHelper";
import axios from 'axios';

export class API {
  public static uploadImage = async (_file: File) => {

    try {
      // 创建 FormData 对象，并将文件附加到其中
      const formData = new FormData();
      formData.append('file', _file);


      // 发送 POST 请求到 /api/upload
      const response = await fetch('/api_document/upload', {
        method: 'POST',
        body: formData,
      });

      // 如果上传成功
      if (response.ok) {
        const data = await response.json();
        console.log('Image uploaded successfully:', data);
        return data.filePath;
      } else {
        console.error('Image upload failed:', response.statusText);
        return '/placeholder-image.jpg';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return '/placeholder-image.jpg';
    }
  }

  public static sendTokenToServer = async () => {
    //get from cookie first
    const cookies = document.cookie.split(';');
    const ctoken = cookies.find(cookie => cookie.trim().startsWith('jwtToken='));
    const token = ctoken ? ctoken.trim().split('=')[1] : null;
    if (token) {
      LocalStorageHelper.setItem('jwtToken', token);
    } else {
      //if empty get from url
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      LocalStorageHelper.setItem('jwtToken', token);
    }
    return LocalStorageHelper.getItem('jwtToken');
  }

  public static getToken = () => {
    return LocalStorageHelper.getItem('jwtToken');
  }

  public static generatePDf = async (html: string, room: string, coverPage: boolean) => {


    const credential = getCredential();

    try {

      const dataToSend = {
        'html': html,
        'room': room,
        'token': API.getToken(),
        'coverPage': coverPage === true ? 1 : 0,
      };


      const response = await fetch('/api_document/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/html',
          'Authorization': `${credential}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {

        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const contentDisposition = response.headers.get('Content-Disposition');

        let fileName = 'downloaded-file.pdf';
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename=([^"]+)/);
          if (matches && matches.length > 1) {
            fileName = matches[1];
          }
        }

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        link.click();

        URL.revokeObjectURL(pdfUrl);
      } else {
        return 0;
      }

    } catch (error) {
      return 0;
    }
  }

  public static getConvertToken = async () => {
    try {
      const response = await fetch('/api_document/getConvertToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment')
      }
      const data = await response.json()


      const {token} = data

      console.log(token)
      // set state when the data received
      return token;
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
      }

      return
    }
  }

  public static saveTip = async (html: string, json: string, room: string) => {
    try {
      const credential = getCredential();

      const response = await axios.post(
        '/api_document/tiptap',
        {
          content_html: html,
          content_json: json,
          action: 'save',
          file_id: room,
          rtime: new Date().getTime()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${credential}`,
          },
          timeout: 3000,
        }
      );

      if (response.status !== 200) {
        throw new Error('Internal Server Error (500). Please refresh the page and try again.');
      }

      return response.data;

    } catch (e) {
      // @ts-ignore
      console.log(e.code === 'ECONNABORTED')
      // @ts-ignore
      if (e.code === 'ECONNABORTED') {
        return { success: 0, msg: "Request timed out (3s). Please refresh the page and try again." };
      }
    }
    return { success: 0, msg: 'Internal Server Error (500). Please refresh the page and try again.' };
  }

  public static saveExtraToEditor = async (room: string|undefined, data: object) => {
    try {
      const credential = getCredential();

      const response = await fetch('/api_document/tiptap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${credential}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment')
      }
      // set state when the data received
      return true;
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
      }

      return false;
    }
  }

  // this one used to check if this file is exist in the database
  public static getFileInfo = async (room: string) => {

    const credential = getCredential();

    if (credential == null) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    const response = await fetch(`/api_document/file?room=${room}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${credential}`,
      },
    })

    const dataResponse = await response.json();



    // Handle specific HTTP status codes
    if (response.status === 401) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    if (response.status === 404) {
      const detail = JSON.parse(dataResponse.details);
      throw new Error(detail.message);
    }

    if (response.status === 500) {
      throw new Error('Internal Server Error (500). Please try again later or contact the administrator.');
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}. Please contact the administrator.`);
    }

    // set state when the data received
    return dataResponse;

  }
  public static getSettings = async (room: string|undefined) => {
    try {
      const credential = getCredential();
      console.log(credential)
      const response = await fetch(`/api_document/setting?room=${room}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${credential}`,
        },
      })

      if (!response.ok) {
        return []
      }
      const data = await response.json();


      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
      }

      return []
    }
  }


  
  public static getSnapshot = async (room: string, page: number = 0, pageSize: number = 25) => {

    const credential = getCredential();

    if (credential == null) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    const response = await fetch(`/api_document/snapshot?room=${room}&page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${credential}`,
      },
    })

    const dataResponse = await response.json();

    // Handle specific HTTP status codes
    if (response.status === 401) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    if (response.status === 404) {
      const detail = JSON.parse(dataResponse.details);
      throw new Error(detail.message);
    }

    if (response.status === 500) {
      throw new Error('Internal Server Error (500). Please try again later or contact the administrator.');
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}. Please contact the administrator.`);
    }

    // set state when the data received
    return dataResponse;

  }

  public static getSnapshotDetail = async (snapshotId: number) => {

    const credential = getCredential();

    if (credential == null) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    const response = await fetch(`/api_document/snapshot_detail?id=${snapshotId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${credential}`,
      },
    })

    const dataResponse = await response.json();

    // Handle specific HTTP status codes
    if (response.status === 401) {
      throw new Error('Unauthorized access (401). Please log in again or contact the administrator.');
    }

    if (response.status === 404) {
      const detail = JSON.parse(dataResponse.details);
      throw new Error(detail.message);
    }

    if (response.status === 500) {
      throw new Error('Internal Server Error (500). Please try again later or contact the administrator.');
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}. Please contact the administrator.`);
    }

    // set state when the data received
    return dataResponse;

  }
}

export default API
